import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { QueryWithPaginationDto } from '../../common/dto/query-with-pagination';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtUser } from '../../common/types/jwt-user.type';
import { Role } from '../users/schemas/user.schema';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get('get-all-transactions-with-userId/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage("User's Transactions fetched successfully.")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all transactions for a user',
    description:
      'This is the endpoint for fetching all the transactions of a user by using the user ID. This endpoint can be accessed by the user that owns the account and also by the admin. This endpoint is expecting userId from req.params, page, limit and searchParams from req.query. It is also expecting accessToken from req.headers.',
  })
  @ApiResponse({
    status: 200,
    description: "User's Transactions fetched successfully.",
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch transactions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllUserTransactionByUserId(
    @GetCurrentUser() user: JwtUser,
    @Param('userId') userId: string,
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const transactions =
      await this.transactionsService.getAllUserTransactionByUserId(
        user,
        userId,
        queryWithPaginationDto,
      );

    return transactions;
  }

  @Get('get-all-transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('All Transactions fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all transactions on the app',
    description:
      'This is the endpoint for fetching all the transactions on the app for admin use. This endpoint can be accessed by admin only. It is expecting accessToken from req.headers',
  })
  @ApiResponse({
    status: 200,
    description: 'All Transactions fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch transactions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getAllTransactions(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    const transactions = await this.transactionsService.getAllTransactions(
      queryWithPaginationDto,
    );

    return transactions;
  }

  @Get('get-transaction-by-id/:transactionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Transaction fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a transaction on the app',
    description:
      'This is the endpoint for fetching a transaction on the app. This endpoint is expecting transactionId from req.params and it is also expecting accessToken from req.headers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch transaction',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit exceeded',
  })
  async getTransactionById(@Param('transactionId') transactionId: string) {
    const transaction =
      await this.transactionsService.getTransactionById(transactionId);

    return transaction;
  }
}
