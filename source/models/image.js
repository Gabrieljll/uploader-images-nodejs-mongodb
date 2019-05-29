const { Schema, model } = require('mongoose');

const imageSchema = new Schema({
    pet: { type: String },
    race: { type: String },
    place: { type: String },
    contact: { type: String },
    description: { type: String },
    filename: { type: String },
    path: { type: String },
    originalname: { type: String },
    mimetype: { type: String },
    size: { type: Number },
    created_at: { type: Date, default: Date.now() },
    user: { type: String }      //este ultimo lo pienso 
});                         //usar para enlazar la img con el usuario por medio del id
module.exports = model('Image', imageSchema);