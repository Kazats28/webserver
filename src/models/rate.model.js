import mongoose, { Schema } from "mongoose";
import modelOptions from "./model.options.js";

export default mongoose.model(
  "Rate",
  mongoose.Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rate: {
        type: Number,
        required: true,
    },
    movie: {
      type: mongoose.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
  }, modelOptions)
);