import { Plan } from 'src/modules/users/schemas/user.schema';

export const EXAM_PLAN_MAP: Record<string, Plan> = {
  // SECONDARY
  utme: Plan.SECONDARY,
  'post-utme': Plan.SECONDARY,
  wassce: Plan.SECONDARY,
  jamb: Plan.SECONDARY,
  neco: Plan.SECONDARY,
  ijmb: Plan.SECONDARY,

  // TERTIARY
  nursing: Plan.TERTIARY,
  medical: Plan.TERTIARY,
  law: Plan.TERTIARY,

  // OTHERS
  coren: Plan.OTHERS,
  ican: Plan.OTHERS,
  anna: Plan.OTHERS,
  ielts: Plan.OTHERS,
};
