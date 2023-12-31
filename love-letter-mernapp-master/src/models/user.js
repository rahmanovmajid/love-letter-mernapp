const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: [true, 'First name is required!'],
        trim: true,
    },
    last_name: {
        type: String,
        required: [true, 'Last name is required!'],
        trim: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required!'],
        unique: [true, 'Username is already taken!'],
        lowercase: true,
        validate: {
            validator: function (username) {
                return /^(?=.{6,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/.test(username);
            },
            message: props => `${props.value} is not a valid username!`,
        },
    },
    // regex for password
    password: {
        type: String,
        required: [true, 'Password is required!'],
//        validate: {
  //          validator: function (password) {
    //            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,50})/.test(password);
      //      },
        //    message: props => `Password "${props.value}" is not strong enough!`,
        //},
    },
    avatar: {
        type: String,
    },
    email: {
        type: String,
        validate: {
            validator: function (email) {
                return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                    email
                );
            },
            message: props => `${props.value} is not a valid e-mail address!`,
        },
        required: [true, 'E-mail address is required!'],
        unique: [true, 'E-mail address is already registered!'],
    },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED'],
        default: 'PENDING',
    },
    reset_token: {
        type: String,
    },
    reset_expires: {
        type: Date,
    },
});

userSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(this.password, salt);
        this.password = hashedPassword;
    }
    next();
});

userSchema.methods.isMatchedPassword = function (verifyPassword) {
    return bcrypt.compareSync(verifyPassword, this.password);
};

userSchema.methods.getSignedJWTToken = function () {
    const payload = {
        userId: this._id,
        status: this.status,
    };
    const options = {
        expiresIn: process.env.JWT_EXP_DATE,
    };
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, options);
};

userSchema.methods.setResetToken = function () {
    this.reset_token = crypto.randomBytes(20).toString('hex');
    this.reset_expires = Date.now() + 1800000;
};

module.exports = mongoose.model('User', userSchema);