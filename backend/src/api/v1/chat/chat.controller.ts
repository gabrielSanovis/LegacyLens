import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string };
}

class SendMessageDto {
  content: string;
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('projects/:projectId/conversations')
  createConversation(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? 'anonymous';
    return this.chatService.createConversation(projectId, userId);
  }

  @Get('projects/:projectId/conversations')
  listConversations(
    @Param('projectId') projectId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? 'anonymous';
    return this.chatService.listConversations(projectId, userId);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() body: SendMessageDto,
  ) {
    return this.chatService.sendMessage(conversationId, body.content);
  }
}
