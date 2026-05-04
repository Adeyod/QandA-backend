import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post('create-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Account created successfully.')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Adding user bank account.',
    description:
      'This is the endpoint for user to add his or her account details. This endpoint is expecting accessToken from req.headers and also the DTO. This endpoint is for only users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to create account.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @GetCurrentUser() user: JwtUser,
  ) {
    return await this.accountsService.createAccount(user, createAccountDto);
  }

  @Get('get-user-account/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('Account fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetches user account.',
    description:
      'This is the endpoint for fetching user account. This can be used by the user that has the account or admin. It is expecting userId from req.params.',
  })
  @ApiResponse({
    status: 200,
    description: 'Account fetched successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch account details.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getUserAccount(
    @Param('userId') userId: string,
    @GetCurrentUser() user: JwtUser,
  ) {
    return await this.accountsService.getUserAccount(user, userId);
  }

  @Get('get-all-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @SuccessMessage('All accounts fetched successfully.')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all accounts on the app.',
    description:
      'This is the endpoint for fetching all accounts on the app. This endpoint is expecting accessToken from req.headers, page, limit and searchParams from req.query and it can only be used by admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accounts fetched successfully.',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Unable to fetch accounts.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllAccounts(
    @Query() queryWithPaginationDto: QueryWithPaginationDto,
  ) {
    return await this.accountsService.getAllAccounts(queryWithPaginationDto);
  }
}
