import { Controller, Get, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Inventory } from './inventory.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':id')
  async getInventory(@Param('id') id: string): Promise<Inventory | null> {
    return this.inventoryService.getInventory(id);
  }
}
