import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportMessage, SupportSender } from 'src/support/entities/support-message.entity';
import { NotificationsService } from 'src/notifications/service/notifications/notifications.service';
import { NotificationCategory } from 'src/notifications/entities/notification.entity';
import { User } from 'src/users/entities/user.entity/user.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportMessage) private messageRepository: Repository<SupportMessage>,
    private notificationsService: NotificationsService,
  ) {}

  // ---- Registered-user side: always acts on the caller's own thread ----

  async sendFromUser(userId: number, content: string) {
    const message = this.messageRepository.create({
      user: { id: userId } as User,
      sender: SupportSender.USER,
      content,
    });
    return this.messageRepository.save(message);
  }

  // Separate from getConversationForUser on purpose: that method marks
  // admin replies as read as a side effect of opening the conversation, so
  // it can't also be used to show a proactive badge before the user has
  // actually seen the page.
  async getUnreadCountForUser(userId: number) {
    return this.messageRepository
      .count({ where: { user: { id: userId }, sender: SupportSender.ADMIN, isRead: false } })
      .then((unreadCount) => ({ unreadCount }));
  }

  async getConversationForUser(userId: number) {
    const messages = await this.messageRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
    // Opening the conversation is what marks the admin's replies as read.
    const unreadFromAdmin = messages.filter((m) => m.sender === SupportSender.ADMIN && !m.isRead);
    if (unreadFromAdmin.length) {
      await this.messageRepository.update(
        unreadFromAdmin.map((m) => m.id),
        { isRead: true },
      );
    }
    return messages;
  }

  // ---- Guest side: no account required. The frontend generates a random
  // token, stores it in the visitor's own browser, and uses it as the
  // identifier for every call below — this also covers a suspended user
  // who can no longer log in but still needs to reach support. ----

  async sendFromGuest(guestId: string, guestName: string | undefined, content: string) {
    const message = this.messageRepository.create({
      guestId,
      guestName: guestName || null,
      sender: SupportSender.USER,
      content,
    });
    return this.messageRepository.save(message);
  }

  async getUnreadCountForGuest(guestId: string) {
    return this.messageRepository
      .count({ where: { guestId, sender: SupportSender.ADMIN, isRead: false } })
      .then((unreadCount) => ({ unreadCount }));
  }

  async getConversationForGuest(guestId: string) {
    const messages = await this.messageRepository.find({
      where: { guestId },
      order: { createdAt: 'ASC' },
    });
    const unreadFromAdmin = messages.filter((m) => m.sender === SupportSender.ADMIN && !m.isRead);
    if (unreadFromAdmin.length) {
      await this.messageRepository.update(
        unreadFromAdmin.map((m) => m.id),
        { isRead: true },
      );
    }
    return messages;
  }

  // ---- Admin side: targets any conversation, registered or guest ----

  async sendFromAdmin(userId: number, content: string) {
    const message = this.messageRepository.create({
      user: { id: userId } as User,
      sender: SupportSender.ADMIN,
      content,
    });
    const saved = await this.messageRepository.save(message);
    await this.notificationsService.create(
      userId,
      NotificationCategory.SUPPORT,
      'New support reply',
      'Our team has replied to your support conversation.',
    );
    return saved;
  }

  async getConversationForAdmin(userId: number) {
    const messages = await this.messageRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
    // Opening a customer's conversation is what marks their messages as read.
    const unreadFromUser = messages.filter((m) => m.sender === SupportSender.USER && !m.isRead);
    if (unreadFromUser.length) {
      await this.messageRepository.update(
        unreadFromUser.map((m) => m.id),
        { isRead: true },
      );
    }
    return messages;
  }

  // Guest equivalents of the two methods above — no notification is sent
  // on an admin reply to a guest, since there's no account to notify.
  async sendFromAdminToGuest(guestId: string, content: string) {
    const message = this.messageRepository.create({
      guestId,
      sender: SupportSender.ADMIN,
      content,
    });
    return this.messageRepository.save(message);
  }

  async getConversationForGuestAdmin(guestId: string) {
    const messages = await this.messageRepository.find({
      where: { guestId },
      order: { createdAt: 'ASC' },
    });
    const unreadFromGuest = messages.filter((m) => m.sender === SupportSender.USER && !m.isRead);
    if (unreadFromGuest.length) {
      await this.messageRepository.update(
        unreadFromGuest.map((m) => m.id),
        { isRead: true },
      );
    }
    return messages;
  }

  // One row per conversation — registered user or guest, whichever has at
  // least one message — with its latest message and unread count. The
  // admin's single, unified inbox-style list. Aggregated in memory since
  // message volume in a demo app is small; same approach as
  // BankingService's transaction history merge.
  async getAllConversations() {
    const messages = await this.messageRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    type ConvoEntry = { key: string; isGuest: boolean; user?: User; guestId?: string; guestName?: string | null; latest: SupportMessage; unreadCount: number };
    const byKey = new Map<string, ConvoEntry>();

    for (const message of messages) {
      const isGuest = !message.user;
      const key = isGuest ? `guest:${message.guestId}` : `user:${message.user!.id}`;
      const existing = byKey.get(key);
      const isUnreadFromCustomer = message.sender === SupportSender.USER && !message.isRead;

      if (!existing) {
        byKey.set(key, {
          key, isGuest,
          user: isGuest ? undefined : message.user!,
          guestId: isGuest ? message.guestId! : undefined,
          guestName: isGuest ? message.guestName : undefined,
          latest: message,
          unreadCount: isUnreadFromCustomer ? 1 : 0,
        });
      } else {
        if (isUnreadFromCustomer) existing.unreadCount += 1;
        // Keep the most recent guestName seen, in case they introduced
        // themselves partway through the conversation.
        if (isGuest && message.guestName && !existing.guestName) existing.guestName = message.guestName;
      }
    }

    return Array.from(byKey.values())
      .sort((a, b) => b.latest.createdAt.getTime() - a.latest.createdAt.getTime())
      .map(({ isGuest, user, guestId, guestName, latest, unreadCount }) => {
        // latest.user would otherwise carry its own full (unsanitized) User
        // relation, duplicating — and leaking the password hash alongside —
        // the sanitized top-level user field below.
        const { user: _latestUser, ...safeLatest } = latest;
        if (isGuest) {
          return { isGuest: true, guestId, guestName: guestName || null, latestMessage: safeLatest, unreadCount };
        }
        const { password, ...safeUser } = user!;
        return { isGuest: false, user: safeUser, latestMessage: safeLatest, unreadCount };
      });
  }
}