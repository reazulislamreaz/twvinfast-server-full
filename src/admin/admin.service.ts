import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  getStatus() {
    return { status: 'admin-service-ok' };
  }


  
}
