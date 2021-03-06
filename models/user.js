const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { AuthenticationError } = require('apollo-server');


const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    address: { type: String, required: true },
    admin: { type: Boolean, default: 0 },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
}, { timestamps: true });

userSchema.plugin(mongoosePaginate);

userSchema.statics.hashPassword = function (password) {
    let salt = bcrypt.genSaltSync(15);
    let hash = bcrypt.hashSync(password, salt);
    return hash;
}

userSchema.statics.checkApiToken = async (req, api_secret_key) => {
    const token = req.headers['x-token'];
    if (token) {
        try {
            return await jwt.verify(token, api_secret_key);
        } catch (e) {
            throw new AuthenticationError('Your token expired, login again')
        }
    }
    return undefined;
}

userSchema.statics.createToken = async (user, secret, expiresIn) => {
    const { id, email } = user;
    return await jwt.sign({ id, email }, secret, { expiresIn });
}

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password)
}

userSchema.virtual('articles', {
    ref: 'Article',
    localField: '_id',
    foreignField: 'user'
})

module.exports = mongoose.model('User', userSchema);