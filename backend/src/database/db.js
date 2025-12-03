import mongoose from "mongoose";

const connectToDB = () => {
    mongoose.connect(`${process.env.MONGODB_URI}`)
    .then(() => {
        console.log("DB Connected!");
    })
}

export default connectToDB;