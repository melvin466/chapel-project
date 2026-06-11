import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import userService from '@/services/userService';
import { validateForm } from '@/utils/adminValidation';

type UserRole = 'member' | 'chaplain' | 'admin' | 'chapel_leader';

const roleOptions: { value: UserRole; label: string; shortLabel: string }[] = [
  { value: 'member', label: 'Member', shortLabel: 'Mem' },
  { value: 'chaplain', label: 'Chaplain', shortLabel: 'Cha' },
  { value: 'admin', label: 'Admin', shortLabel: 'Adm' },
  { value: 'chapel_leader', label: 'Chapel Leader', shortLabel: 'Lead' },
];

const roleFilterOptions = [{ value: 'all', label: 'All', shortLabel: 'All' }, ...roleOptions];

const getRoleLabel = (role: string) => roleOptions.find(option => option.value === role)?.label || role;

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
}

interface AdminUsersProps {
  onBack: () => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'date'>('name');
  const [searchText, setSearchText] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: UserRole;
    isActive: boolean;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'member',
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data?.users || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(u => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSearch = !searchText ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase());
      return matchesRole && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'role') {
        return a.role.localeCompare(b.role);
      }
      return 0;
    });

    return filtered;
  }, [users, roleFilter, searchText, sortBy]);

  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'member',
      isActive: true,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      password: '',
      role: user.role,
      isActive: user.isActive,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    const fieldsToValidate = editingUser ? ['firstName', 'lastName', 'email', 'phoneNumber'] :
      ['firstName', 'lastName', 'email', 'phoneNumber', 'password'];
    const { valid, errors } = validateForm(formData, fieldsToValidate);

    if (!valid) {
      setFormErrors(errors);
      return;
    }

    try {
      setMessage(null);
      const payload = { ...formData };
      if (editingUser && !payload.password) {
        delete (payload as any).password;
      }

      if (editingUser) {
        await userService.updateUser(editingUser._id, payload);
        setMessage({ type: 'success', text: 'User updated successfully' });
      } else {
        await userService.createUser(payload);
        setMessage({ type: 'success', text: 'User created successfully' });
      }
      setShowForm(false);
      loadUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save user' });
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await userService.deleteUser(user._id);
              setMessage({ type: 'success', text: 'User deleted' });
              loadUsers();
            } catch (error: any) {
              setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete user' });
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <ThemedView style={[styles.card, !item.isActive && styles.inactiveCard]}>
      <View style={styles.cardContent}>
        <ThemedText style={styles.name}>{item.firstName} {item.lastName}</ThemedText>
        <ThemedText style={styles.email}>{item.email}</ThemedText>
        <View style={styles.meta}>
          <ThemedText style={[styles.role, styles[`role_${item.role}`]]}>
            {getRoleLabel(item.role)}
          </ThemedText>
          <ThemedText style={styles.status}>
            {item.isActive ? '✓ Active' : '✗ Inactive'}
          </ThemedText>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={() => handleEdit(item)}>
          <ThemedText style={styles.buttonText}>Edit</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDelete(item)}>
          <ThemedText style={styles.buttonText}>Del</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ThemedText style={styles.backButton}>‹ Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Users</ThemedText>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
          <ThemedText style={styles.createButtonText}>+ New</ThemedText>
        </TouchableOpacity>
      </View>

      {message && (
        <ThemedView style={[styles.message, styles[`message-${message.type}`]]}>
          <ThemedText style={styles.messageText}>{message.text}</ThemedText>
        </ThemedView>
      )}

      <View style={styles.controlsContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or email..."
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={searchText}
          onChangeText={setSearchText}
        />
        <View style={styles.filterRow}>
          {roleFilterOptions.map(role => (
            <TouchableOpacity
              key={role.value}
              style={[styles.filterBtn, roleFilter === role.value && styles.filterBtnActive]}
              onPress={() => setRoleFilter(role.value)}
            >
              <ThemedText style={[styles.filterText, roleFilter === role.value && styles.filterTextActive]}>
                {role.shortLabel}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.sortRow}>
          {['name', 'role'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[styles.sortBtn, sortBy === sort && styles.sortBtnActive]}
              onPress={() => setSortBy(sort as any)}
            >
              <ThemedText style={styles.sortText}>{sort.charAt(0).toUpperCase() + sort.slice(1)}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.brand} />
        </View>
      ) : filteredAndSortedUsers.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={styles.emptyText}>No users found</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item._id}
          scrollEnabled={false}
          ListHeaderComponent={
            <ThemedText style={styles.resultCount}>
              {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? 's' : ''}
            </ThemedText>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent>
        <ThemedView style={styles.modal}>
          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formHeader}>
              <ThemedText style={styles.formTitle}>
                {editingUser ? 'Edit User' : 'Create User'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {['firstName', 'lastName', 'email', 'phoneNumber', ...(!editingUser ? ['password'] : [])].map(field => (
              <View key={field}>
                <TextInput
                  style={[styles.input, formErrors[field] && styles.inputError]}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData[field as keyof typeof formData] as string}
                  onChangeText={text => {
                    setFormData({ ...formData, [field]: text });
                    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: '' });
                  }}
                  secureTextEntry={field === 'password'}
                  keyboardType={field === 'email' ? 'email-address' : field === 'phoneNumber' ? 'phone-pad' : 'default'}
                />
                {formErrors[field] && <ThemedText style={styles.errorText}>{formErrors[field]}</ThemedText>}
              </View>
            ))}

            <ThemedText style={styles.label}>Role</ThemedText>
            <View style={styles.roleButtons}>
              {roleOptions.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleButton, formData.role === role.value && styles.roleButtonActive]}
                  onPress={() => setFormData({ ...formData, role: role.value })}
                >
                  <ThemedText style={[styles.roleButtonText, formData.role === role.value && styles.roleButtonTextActive]}>
                    {role.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setShowForm(false)}>
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <ThemedText style={styles.buttonText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(16, 22, 28, 0.95)' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: { fontSize: 16, color: '#9bd8aa', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  createButton: {
    backgroundColor: '#2f7d46',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  createButtonText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  message: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  'message-success': {
    backgroundColor: 'rgba(47, 125, 70, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#9bd8aa',
  },
  'message-error': {
    backgroundColor: 'rgba(194, 65, 58, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  messageText: { color: '#ffffff', fontSize: 12 },
  controlsContainer: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    color: '#1f2933',
    fontSize: 14,
  },
  filterRow: { flexDirection: 'row', gap: Spacing.one, marginBottom: Spacing.two },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#2f7d46', borderColor: '#9bd8aa' },
  filterText: { fontSize: 10, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' },
  filterTextActive: { color: '#ffffff' },
  sortRow: { flexDirection: 'row', gap: Spacing.two },
  sortBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  sortBtnActive: { backgroundColor: '#315f72', borderColor: '#d6a650' },
  sortText: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' },
  resultCount: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inactiveCard: { opacity: 0.6 },
  cardContent: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#ffffff', marginBottom: Spacing.one },
  email: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' },
  meta: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  role: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  role_member: { color: '#9bd8aa' },
  role_admin: { color: '#f44336' },
  role_chaplain: { color: '#2196F3' },
  role_chapel_leader: { color: '#FF9800' },
  status: { fontSize: 10, color: '#9bd8aa' },
  actions: { flexDirection: 'row', gap: Spacing.one },
  button: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one, alignItems: 'center' },
  editButton: { backgroundColor: 'rgba(214, 166, 80, 0.3)' },
  deleteButton: { backgroundColor: 'rgba(194, 65, 58, 0.3)' },
  buttonText: { fontSize: 10, fontWeight: '600', color: '#ffffff' },
  modal: { flex: 1, backgroundColor: 'rgba(16, 22, 28, 0.98)' },
  formContent: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.four },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  closeButton: { fontSize: 24, color: 'rgba(255, 255, 255, 0.6)' },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 51, 0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    color: '#1f2933',
    fontSize: 14,
  },
  inputError: { borderColor: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  errorText: { color: '#ff6b6b', fontSize: 11, marginBottom: Spacing.two, marginTop: -Spacing.one },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.78)', marginBottom: Spacing.two, marginTop: Spacing.two },
  roleButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.four },
  roleButton: {
    flex: 0.48,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: '#2f7d46', borderColor: '#9bd8aa' },
  roleButtonText: { fontSize: 12, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  roleButtonTextActive: { color: '#ffffff' },
  formActions: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.four },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  saveButton: { flex: 1, backgroundColor: '#2f7d46', paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center' },
});

export default AdminUsers;
