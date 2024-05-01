import mongoose, { Schema } from "mongoose";
import modelOptions from "./model.options.js";

export default mongoose.model(
  "Booking",
  mongoose.Schema({
    movie: {
      type: mongoose.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    hour: {
      type: String,
      required: true,
    },
    seatNumber: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  }, modelOptions)
);