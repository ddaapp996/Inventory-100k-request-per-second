import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRedis()
    private readonly redis: Redis
  ) {}

  async getInventory(id: string): Promise<Inventory | null> {
    const cachedInventory = await this.redis.get(`inventory:${id}`);
    if (cachedInventory) {
      return JSON.parse(cachedInventory) as Inventory;
    }
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (inventory) {
      await this.redis.set(`inventory:${id}`, JSON.stringify(inventory), 'EX', 60);
      return inventory;
    }
    return null;
  }

  async createInventory(inventory: Inventory): Promise<Inventory> {
    const newInventory = await this.inventoryRepository.save(inventory);
    await this.redis.set(`inventory:${newInventory.id}`, JSON.stringify(newInventory));
    return newInventory;
  }
}
