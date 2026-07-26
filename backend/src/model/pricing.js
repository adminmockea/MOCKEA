import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
    priceId:{
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    subtitle: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    features: {
        type: [String],
        required: true,
    },
    isPopular: {
        type: Boolean,
        default: false,
    },
    CtaBtn: {
        type: String,
        required: true,
    },
    bdtPrice: {
        type: String,
        default: "",
    },
},{timestamps:true});

const Pricing = mongoose.model("Pricing", pricingSchema);

export default Pricing;