import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';
import userRoute from "./src/routes/user.route.js";
import movieRoute from "./src/routes/movie.route.js";
import adminRoute from "./src/routes/admin.route.js";
import bookingRoute from "./src/routes/booking.route.js";
import favoriteRoute from "./src/routes/favorite.route.js";
import rateRoute from "./src/routes/rate.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/user", userRoute);
app.use("/movie", movieRoute);
app.use("/admin", adminRoute);
app.use("/booking", bookingRoute);
app.use("/favorite", favoriteRoute);
app.use("/rate", rateRoute);

// Chuyển đổi URL của file hiện tại thành đường dẫn tệp
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thiết lập multer cho việc upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, 'uploads/')); // Đường dẫn tuyệt đối tới thư mục uploads
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const filePath = path.resolve(__dirname, 'uploads/', baseName + extension);

    // Kiểm tra nếu file tồn tại và xóa file đó
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete existing file: ${err}`);
            cb(err);
          } else {
            console.log(`Deleted existing file: ${filePath}`);
            cb(null, baseName + extension);
          }
        });
      } else {
        cb(null, baseName + extension);
      }
    });
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('video'), (req, res) => {
  res.send({ filePath: `uploads/${req.file.filename}` });
});

// Sử dụng đường dẫn tuyệt đối để phục vụ các tệp tĩnh
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

mongoose.connect(`mongodb+srv://lynk64te:${process.env.MONGODB_PASSWORD}@cluster0.zlxkken.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
).then(() => {
  console.log("Mongodb connected");
  app.listen(process.env.PORT_ENV, () => {
    console.log(`Server is listening on port ${process.env.PORT_ENV}`);
  });
}).catch((err) => {
  console.log({ err });
});
