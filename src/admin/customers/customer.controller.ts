import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // 🔥 GET ALL CUSTOMERS
  @Get()
  getAllCustomers(
    @Query('business_id', ParseIntPipe) business_id: number,
    @Query('search') search?: string,
  ) {
    return this.customerService.getAllCustomers(business_id, search);
  }
}
