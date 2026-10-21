import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Activity payload is required');
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw badRequest('userId, teamId, type, and minutes are required');
  }

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw badRequest('userId must be a valid ObjectId');
  }

  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw badRequest('teamId must be a valid ObjectId');
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw badRequest('type must be a non-empty string');
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw badRequest('minutes must be a positive number');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw badRequest('userId must reference an existing user');
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw badRequest('teamId must reference an existing team');
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: Math.max(1, Math.round(minutes)),
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw badRequest('Team payload is required');
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Team name is required');
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw badRequest('Team mascot is required');
  }

  const normalizedMembers = Array.isArray(members) ? members : [];
  const invalidMember = normalizedMembers.find((member) => typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member));
  if (invalidMember !== undefined) {
    throw badRequest('members must contain valid ObjectId strings');
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const entries = await Promise.all(
    totals.map(async ({ _id, totalPoints }, index) => {
      const team = await Team.findById(_id).lean();
      return {
        teamName: team?.name ?? 'Unknown Team',
        totalPoints: Number(totalPoints) || 0,
        rank: index + 1,
      };
    }),
  );

  return entries;
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail?.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = recentActivities
    .map((activity) => String(activity.type ?? '').toLowerCase())
    .filter(Boolean);

  const workouts = await Workout.find().lean();

  const scored = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      const goal = String(user.fitnessGoal ?? '').toLowerCase();
      let score = 0;

      if (focus === goal) score += 3;
      if (recentTypes.includes(focus)) score += 2;
      if (recentTypes.some((type) => type.includes(focus) || focus.includes(type))) score += 2;

      return { workout, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ workout, score }) => ({
      title: workout.title,
      focus: workout.focus,
      minutes: workout.minutes,
      difficulty: workout.difficulty,
      reason: recentActivities.length
        ? `Recent activity suggests ${workout.focus} work for your ${user.fitnessGoal ?? 'fitness goal'} and run pattern.`
        : `Your goal is ${user.fitnessGoal ?? 'fitness'} and this ${workout.focus} session matches it.`,
      score,
    }));

  return scored.slice(0, 3);
}

export { User };
