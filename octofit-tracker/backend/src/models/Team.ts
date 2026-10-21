import { Schema, model } from 'mongoose';

const teamSchema = new Schema({
  name: { type: String, required: [true, 'Team name is required'] },
  mascot: { type: String, required: [true, 'Team mascot is required'] },
  members: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  },
});

export const Team = model('Team', teamSchema);
