import mongoose from "mongoose";
import Favorites from "../models/favorite.model.js";
import Movie from "../models/movie.model.js";
import User from "../models/user.model.js";

const addFavorite = async (req, res, next) => {
  const { movie, user } = req.body;

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
  let favorite;

  try {
    favorite = new Favorites({
      movie,
      user,
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    await favorite.save({ session });
    session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }

  if (!favorite) {
    return res.status(500).json({ message: "Unable to add a favorite" });
  }

  return res.status(201).json({ favorite });
};

const getFavoriteById = async (req, res, next) => {
  const id = req.params.id;
  let favorite;
  try {
    favorite = await Favorites.find({movie: id})
  } catch (err) {
    return console.log(err);
  }
  if (!favorite) {
    return res.status(500).json({ message: "Unexpected Error" });
  }
  return res.status(200).json({ favorite });
};
const deleteFavorite = async (req, res, next) => {
  const id = req.params.id;
  let favorite;
  try {
    favorite = await Favorites.findByIdAndRemove(id);
    console.log(favorite);
  } catch (err) {
    return console.log(err);
  }
  if (!favorite) {
    return res.status(500).json({ message: "Unable to Delete" });
  }
  return res.status(200).json({ message: "Successfully Deleted" });
};

export default { addFavorite, deleteFavorite, getFavoriteById };