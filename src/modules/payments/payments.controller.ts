import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { GetCurrentUser } from 'src/common/decorators/get-current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { SuccessMessage } from 'src/common/decorators/success-message.decorator';
import { ApiResponseDto } from 'src/common/dto/api-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type { JwtUser } from 'src/common/types/jwt-user.type';
import { Plan, Role } from '../users/schemas/user.schema';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from './schemas/payment.schema';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}
  @Post('create-payment-intent/:provider/:plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Payment intent successfully created.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User creates payment intent',
    description:
      'This is the endpoint to be called when user clicks on button to make payment. This endpoint returns with payment processor URL for user to make the payment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent successfully created.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create payment intent.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createPaymentIntent(
    @Param('provider') provider: PaymentProvider,
    @Param('plan') plan: Plan,
    @GetCurrentUser() user: JwtUser,
  ) {
    console.log('user._id:', user.sub);
    console.log('user:', user);
    return await this.paymentsService.createPaymentIntent(provider, plan, user);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: PaymentProvider,
    @Req() req: Request,
  ) {
    // console.log('Body:', req.body);
    return await this.paymentsService.handleWebhook(provider, req);
  }
}
