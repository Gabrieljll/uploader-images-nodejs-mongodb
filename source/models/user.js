const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    local: {
        username: String,
        email: String,
        password: String
    },
});

userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
}

module.exports = mongoose.model('User', userSchema);