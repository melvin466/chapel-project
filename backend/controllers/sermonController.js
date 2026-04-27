const Sermon = require('../models/Sermon');

const getSermons = async (req, res) => {
  try {
    const { page = 1, limit = 10, speaker, series } = req.query;
    const filter = {};
    if (speaker) filter.speaker = speaker;
    if (series) filter.series = series;

    const sermons = await Sermon.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sermon.countDocuments(filter);

    res.json({
      success: true,
      data: { sermons, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSermonById = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found' });
    sermon.views += 1;
    await sermon.save();
    res.json({ success: true, data: { sermon } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSermon = async (req, res) => {
  try {
    const sermon = await Sermon.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: { sermon } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const likeSermon = async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    if (!sermon) return res.status(404).json({ success: false, message: 'Sermon not found' });
    
    const liked = sermon.likes.includes(req.user.id);
    if (liked) {
      sermon.likes = sermon.likes.filter(id => id.toString() !== req.user.id);
    } else {
      sermon.likes.push(req.user.id);
    }
    await sermon.save();
    
    res.json({ success: true, liked: !liked, likesCount: sermon.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSermons, getSermonById, createSermon, likeSermon };