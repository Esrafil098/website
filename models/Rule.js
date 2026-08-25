const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['Home', 'Minecraft', 'Discord'],
      unique: true
    },
    rulesArray: {
      type: [String],
      default: []
    },
    updatedBy: {
      type: String,
      default: 'CraftBars Staff'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rule', RuleSchema);
