import mongoose from "mongoose";
import modelOptions from "./model.options.js";
const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  genres: [{
    type: String,
    required: true
  }],
  actors: [{ type: String, required: true }],
  releaseDate: {
    type: Date,
    required: true,
  },
  posterUrl: {
    type: String,
    required: true,
  },
  backgroundUrl: {
    type: String,
    required: true,
  },
  averageRating: {
    type: Number,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  backdrops: [{ type: String }],
  bookings: [{ type: mongoose.Types.ObjectId, ref: "Booking" }],
  admin: {
    type: mongoose.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  mons: [{ type: String }],
  tues: [{ type: String }],
  weds: [{ type: String }],
  thus: [{ type: String }],
  fris: [{ type: String }],
  sats: [{ type: String }],
  suns: [{ type: String }],
}, modelOptions);

export default mongoose.model("Movie", movieSchema);
