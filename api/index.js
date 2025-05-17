const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(mongoose => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const visitorSchema = new mongoose.Schema({
  _id: { type: String, default: 'stats' },
  requestCountToday: { type: Number, default: 0 },
  allTimeRequestCount: { type: Number, default: 0 },
  lastReset: { type: Date, default: new Date() },
});

const VisitorStats = mongoose.models.VisitorStats || mongoose.model('VisitorStats', visitorSchema);

module.exports = async (req, res) => {
  try {
    await connectToDatabase();

    let stats = await VisitorStats.findById('stats');
    if (!stats) {
      stats = new VisitorStats({ _id: 'stats' });
    }

    // Update visitor count setiap request
    stats.requestCountToday += 1;
    stats.allTimeRequestCount += 1;
    await stats.save();

    res.status(200).json({
      requestCountToday: stats.requestCountToday,
      allTimeRequestCount: stats.allTimeRequestCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
