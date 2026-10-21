import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Activity, Team, User, Workout } from '../models/index.js';

// Seed stable demo records without clearing data owned by the application.
async function upsertDemoUser(name: string, email: string, teamId: InstanceType<typeof Team>['_id'], fitnessGoal: string) {
  const previousUser = await User.findOne({ email }).select('_id team');
  if (previousUser?.team && previousUser.team.toString() !== teamId.toString()) {
    await Team.updateOne({ _id: previousUser.team }, { $pull: { members: previousUser._id } });
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, email, team: teamId, fitnessGoal } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await Team.updateOne({ _id: teamId }, { $addToSet: { members: user._id } });
  return user;
}

async function upsertTeam(name: string, mascot: string) {
  return Team.findOneAndUpdate(
    { name },
    { $set: { name, mascot } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertActivity(userId: InstanceType<typeof User>['_id'], teamId: InstanceType<typeof Team>['_id'], type: string, minutes: number, points: number, occurredAt: Date) {
  await Activity.updateOne(
    { user: userId, team: teamId, type, occurredAt },
    { $set: { user: userId, team: teamId, type, minutes, points, occurredAt } },
    { upsert: true },
  );
}

async function upsertWorkout(title: string, focus: string, minutes: number, difficulty: string) {
  await Workout.updateOne(
    { title },
    { $set: { title, focus, minutes, difficulty } },
    { upsert: true },
  );
}

export async function seed() {
  await connectDatabase();
  try {
    const octocats = await upsertTeam('Octocats', 'Mona');
    const robocats = await upsertTeam('Robocats', 'Hubot');
    const codecats = await upsertTeam('Codecats', 'Copilot');
    const bytecats = await upsertTeam('Bytecats', 'Bunny');

    const mona = await upsertDemoUser('Mona', 'mona@example.com', octocats._id, 'endurance');
    const hubot = await upsertDemoUser('Hubot', 'hubot@example.com', robocats._id, 'strength');
    const nova = await upsertDemoUser('Nova', 'nova@example.com', codecats._id, 'mobility');

    const monaRunAt = new Date('2026-01-10T12:00:00.000Z');
    const hubotCycleAt = new Date('2026-01-11T12:00:00.000Z');
    const novaWalkAt = new Date('2026-01-12T12:00:00.000Z');

    await upsertActivity(mona._id, octocats._id, 'run', 40, 40, monaRunAt);
    await upsertActivity(hubot._id, robocats._id, 'cycle', 25, 25, hubotCycleAt);
    await upsertActivity(nova._id, codecats._id, 'walk', 35, 35, novaWalkAt);

    await upsertWorkout('Intervals', 'endurance', 30, 'moderate');
    await upsertWorkout('Strength Circuit', 'strength', 30, 'moderate');
    await upsertWorkout('Mobility Flow', 'mobility', 20, 'easy');

    await Team.updateOne({ _id: bytecats._id }, { $addToSet: { members: { $each: [mona._id, hubot._id, nova._id] } } });
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  await seed();
}
