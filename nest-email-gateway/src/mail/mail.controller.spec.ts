import { Test, TestingModule } from '@nestjs/testing';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

describe('MailController', () => {
  let controller: MailController;
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        {
          provide: MailService,
          useValue: {
            enqueueSend: jest.fn().mockResolvedValue({ id: 'job123' }),
            listQueue: jest
              .fn()
              .mockResolvedValue([{ id: '1', name: 'send', state: 'waiting' }]),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MailController>(MailController);
    service = module.get<MailService>(MailService);
  });

  it('should send email job', async () => {
    const result = await controller.send(
      { mailboxId: '1', subject: 'Hi' } as any,
      {} as any,
    );
    expect(result).toEqual({ success: true, jobId: 'job123' });
  });

  it('should list queue', async () => {
    const result = await controller.queue();
    expect(result.success).toBe(true);
    expect(service.listQueue).toHaveBeenCalled();
  });

  it('should attach file metadata when file uploaded', async () => {
    const file = { originalname: 'a.txt', size: 123, mimetype: 'text/plain' } as any;
    const dto = { mailboxId: '1', subject: 'WithFile' } as any;
    const result = await controller.send(dto, {} as any, file);
    expect(result).toEqual({ success: true, jobId: 'job123' });
  });
  
});
