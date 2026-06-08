import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { McpNavigationController } from './mcp_navigation.controller';
import { McpNavigationService } from './mcp_navigation.service';
import { ChatHistory } from './chat-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistory])
  ],
  controllers: [McpNavigationController],
  providers: [McpNavigationService],
  exports: [McpNavigationService],
})
export class McpNavigationModule {}