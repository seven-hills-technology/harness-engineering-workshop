import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminDashboard } from './admin.types';

@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @UseGuards(AdminGuard)
  @Get('dashboard')
  dashboard(): Promise<AdminDashboard> {
    return this.admin.getDashboard();
  }
}
