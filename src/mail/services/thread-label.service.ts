import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ThreadLabelService {
  constructor(private prisma: PrismaService) {}

  /* ===============================
     GET LABELS (SIDEBAR)
  =============================== */
  async getLabels(mailbox_id: number) {
    return this.prisma.threadLabel.findMany({
      where: { mailbox_id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        created_at: true,
      },
    });
  }

  /* ===============================
     CREATE LABEL
  =============================== */
  async createLabel(mailbox_id: number, name: string) {
    if (!name) {
      throw new NotFoundException('Label name required');
    }

    return this.prisma.threadLabel.create({
      data: {
        mailbox_id,
        name: name.toLowerCase().trim(),
      },
    });
  }

  /* ===============================
     UPDATE LABEL
  =============================== */
  async updateLabel(id: number, name: string) {
    if (!name) {
      throw new NotFoundException('Label name required');
    }

    return this.prisma.threadLabel.update({
      where: { id },
      data: {
        name: name.toLowerCase().trim(),
      },
    });
  }

  /* ===============================
     DELETE LABEL
  =============================== */
  async deleteLabel(id: number) {
    // 🔥 pivot rows auto delete হবে (onDelete: Cascade)
    return this.prisma.threadLabel.delete({
      where: { id },
    });
  }

  /* ===============================
     ASSIGN LABEL → THREAD
  =============================== */
  async addLabelToThread(thread_id: number, label_id: number) {
    return this.prisma.emailThreadLabel.create({
      data: {
        thread_id,
        label_id,
      },
    });
  }

  /* ===============================
     REMOVE LABEL ← THREAD
  =============================== */
  async removeLabelFromThread(thread_id: number, label_id: number) {
    return this.prisma.emailThreadLabel.delete({
      where: {
        thread_id_label_id: {
          thread_id,
          label_id,
        },
      },
    });
  }
}
