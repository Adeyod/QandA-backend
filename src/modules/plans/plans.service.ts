import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlansRepository } from './repositories/plan.repository';
import { PlanCode } from './schemas/plan.schema';

@Injectable()
export class PlansService {
  constructor(private readonly planRepo: PlansRepository) {}

  async getAllPlans() {
    const response = await this.planRepo.findAll();

    return response;
  }

  async getPlanById(planId: string) {
    const response = await this.planRepo.findOneById(planId);

    if (!response) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    if (!response.isActive) {
      throw new BadRequestException({
        message: 'This plan is no more active.',
        success: false,
        status: 400,
      });
    }

    return response;
  }

  async getPlanByCode(code: PlanCode) {
    const response = await this.planRepo.getPlanByCode(code);

    if (!response) {
      throw new NotFoundException({
        message: 'Plan not found.',
        success: false,
        status: 404,
      });
    }

    return response;
  }

  async updatePlanById(planId: string, updatePlanDto: UpdatePlanDto) {
    const response = await this.planRepo.update(planId, updatePlanDto);

    if (!response) {
      throw new BadRequestException({
        message: 'Unable to update plan.',
        success: false,
        status: 400,
      });
    }

    return response;
  }
}
