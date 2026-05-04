import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
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
      'This is the endpoint to be called when user clicks on button to make payment. This endpoint returns with payment processor URL for user to make the payment. This endpoint can only be accessed by user.',
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

  @Get('get-all-user-payments/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('All payments of this user fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all payments for a user.',
    description:
      'This is the endpoint for fetching all the payments of a user. This endpoint is expecting accessToken from req.headers and it is also expecting userId from req.params. This endpoint can be accessed by the payment owner as well as the admin.',
  })
  @ApiResponse({
    status: 200,
    description: "User's payments fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch payments',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPaymentsOfAUserByUserId(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    return this.paymentsService.getAllPaymentsOfAUserByUserId(user, userId);
  }

  @Get('get-all-payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('All payments fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all payments on the app.',
    description:
      'This is the endpoint for fetching all the payments on the application. This endpoint is expecting accessToken from req.params and it can only be used by admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch payments',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllPayments(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return this.paymentsService.getAllPayments(queryWithPaginationDto);
  }
}
