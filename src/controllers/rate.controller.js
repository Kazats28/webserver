import mongoose from "mongoose";
import Rate from "../models/rate.model.js";
import Movie from "../models/movie.model.js";
import User from "../models/user.model.js";

const addRate = async (req, res, next) => {
  const { movie, rate, user } = req.body;

  let existingMovie;
  let existingUser;
  try {
    existingMovie = await Movie.findById(movie);
    existingUser = await User.findById(user);
  } catch (err) {
    return console.log(err);
  }
  if (!existingMovie) {
    return res.status(404).json({ message: "Movie Not Found With Given ID" });
  }
  if (!user) {
    return res.status(404).json({ message: "User not found with given ID " });
  }
  let rating;

  try {
    rating = new Rate({
      movie,
      rate,
      user,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    await rating.save({ session });
    session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }

  if (!rating) {
    return res.status(500).json({ message: "Unable to add a rating" });
  }

  return res.status(201).json({ rating });
};
const updateRate = async (req, res, next) => {
    const {rateId, rate} = req.body;
  
    let rating;
    try {
      rating = await Rate.findById(rateId);
    } catch (err) {
      return res.status(500).json({ message: "Database Error" });
    }
  
    if (!rating) {
      return res.status(404).json({ message: "Rate not found" });
    }
  
    rating.rate = rate;
    try {
      await rating.save();
    } catch (err) {
      return res.status(500).json({ message: `Update failed ${err}` });
    }
  
    return res.status(200).json({ rating });
  };
export default { addRate, updateRate };