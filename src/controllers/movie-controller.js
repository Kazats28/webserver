import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/admin.model.js";
import Movie from "../models/movie.model.js";
import Rate from "../models/rate.model.js";
import Bookings from "../models/booking.model.js";
import Favorites from "../models/favorite.model.js";
const addMovie = async (req, res, next) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token Not Found" });
  }

  let adminId;

  // verify token
  jwt.verify(extractedToken, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) {
      return res.status(400).json({ message: `${err.message}` });
    } else {
      adminId = decrypted.id;
      return;
    }
  });

  //create new movie
  const { title, description, genres, releaseDate, backdrops, posterUrl, backgroundUrl, videoUrl, actors, mons, tues, weds, thus, fris, sats, suns, averageRating } =
    req.body;
  if (
    !title &&
    title.trim() === "" &&
    !description &&
    description.trim() == "" &&
    !posterUrl &&
    posterUrl.trim() === ""
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let movie;
  try {
    movie = new Movie({
      description,
      releaseDate: new Date(`${releaseDate}`),
      genres,
      actors,
      admin: adminId,
      posterUrl,
      backgroundUrl,
      videoUrl,
      title,
      mons, tues, weds, thus, fris, sats, suns,
      averageRating,
      backdrops
    });
    const session = await mongoose.startSession();
    const adminUser = await Admin.findById(adminId);
    session.startTransaction();
    await movie.save({ session });
    adminUser.addedMovies.push(movie);
    await adminUser.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }

  if (!movie) {
    return res.status(500).json({ message: "Request Failed" });
  }

  return res.status(201).json({ movie });
};

const getAllMovies = async (req, res, next) => {
  let movies;

  try {
    movies = await Movie.find();
  } catch (err) {
    return console.log(err);
  }

  if (!movies) {
    return res.status(500).json({ message: "Request Failed" });
  }
  return res.status(200).json({ movies });
};

const getMovieById = async (req, res, next) => {
  const id = req.params.id;
  let movie;
  try {
    movie = await Movie.findById(id);
  } catch (err) {
    return console.log(err);
  }

  if (!movie) {
    return res.status(404).json({ message: "Invalid Movie ID" });
  }

  return res.status(200).json({ movie });
};
const updateMovieById = async (req, res, next) => {
  const {movieId, backdrops, title, description, genres, releaseDate, posterUrl, backgroundUrl, videoUrl, actors, mons, tues, weds, thus, fris, sats, suns } = req.body;

  let movie;
  try {
    movie = await Movie.findById(movieId);
  } catch (err) {
    return res.status(500).json({ message: "Database Error" });
  }

  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  movie.title = title;
  movie.description = description;
  movie.genres = genres;
  movie.releaseDate = releaseDate ? new Date(releaseDate) : movie.releaseDate;
  movie.posterUrl = posterUrl;
  movie.backgroundUrl = backgroundUrl;
  movie.videoUrl = videoUrl;
  movie.actors = actors;
  movie.mons = mons;
  movie.tues = tues;
  movie.weds = weds;
  movie.thus = thus;
  movie.fris = fris;
  movie.sats = sats;
  movie.suns = suns;
  movie.backdrops = backdrops;
  try {
    await movie.save();
  } catch (err) {
    return res.status(500).json({ message: `Update failed ${err}` });
  }

  return res.status(200).json({ movie });
};
const deleteMovie = async (req, res, next) => {
  const id = req.params.id;
  let movie;
  try {
    movie = await Movie.findByIdAndRemove(id);
    console.log(movie);
    await Rate.deleteMany({ movie: id });
    await Bookings.deleteMany({ movie: id });
    await Favorites.deleteMany({ movie: id });
  } catch (err) {
    return console.log(err);
  }
  if (!movie) {
    return res.status(500).json({ message: "Unable to Delete" });
  }
  return res.status(200).json({ message: "Successfully Deleted" });
};
const updateAverageRating = async (req, res, next) => {
  const id = req.params.id;
  let ratings;
  let movie;
  try {
    ratings = await Rate.find({movie: id});
    movie = await Movie.findById(id);
  } catch (err) {
    return res.status(500).json({ message: "Database Error" });
  }

  if (!ratings) {
    return res.status(404).json({ message: "Rating not found" });
  }
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }
  let sum = 0;
  ratings.map((rate, index) => {
    sum = sum + rate.rate;
  })
  const avg = sum / ratings.length;
  movie.averageRating = avg * 2;
  try {
    await movie.save();
  } catch (err) {
    return res.status(500).json({ message: `Update failed ${err}` });
  }

  return res.status(200).json({ movie });
};
export default { addMovie, getAllMovies, getMovieById, updateMovieById, deleteMovie, updateAverageRating };