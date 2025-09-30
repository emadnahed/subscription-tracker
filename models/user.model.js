import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'name is required'], trim: true, lowercase: true, minLength: 2, maxLength: 50 },
    email: { type: String, required: [true, 'email is required'], unique: true, lowercase: true, match: [/\S+@\S+\. \S+/, 'Please fill a valid email address'] },
    password: { type: String, required: [true, 'user password is required'], minLength: 5 },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
