

import { Repository } from "typeorm";
import { SystemController } from "./system.controller"
import { Mailbox } from "src/entities/mailbox.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('SystemController',()=>{
  let controller:SystemController;
  let mailboxRepo:jest.Mocked<Repository<Mailbox>>;

  beforeEach(async()=>{
     
    const module:TestingModule=await Test.createTestingModule({
       controllers:[SystemController],
       providers:[
        {
          provide:getRepositoryToken(Mailbox),
          useValue:{
            find:jest.fn(),
          },
        },
       ],
    }).compile();
    controller=module.get<SystemController>(SystemController);
    mailboxRepo=module.get(getRepositoryToken(Mailbox));

  });
  afterEach(()=>jest.clearAllMocks());

  it('should be defined',()=>{
    expect(controller).toBeDefined();
  });

  it('should return system status with malboxes',async()=>{
    const mockMailboxes=[
      {id:1,email:'a@test.com',provider:'google',tokenExpiresAt:new Date()},
      {id:2,email:'b@test.com',provider:'outlook',tokenExpiresAt:null},
    ];
    mailboxRepo.find.mockResolvedValue(mockMailboxes as any);

    const result=await controller.status();

    expect(result.success).toBe(true);
    expect(result.data.db).toBe(true);
    expect(result.data.worker).toBe(true);
    expect(result.data.mailboxes).toHaveLength(2);
    expect(result.data.mailboxes[0].email).toBe('a@test.com');
    expect(result.data.mailboxes[1].provider).toBe('outlook');
  });

  it('should handle empty mailboxes',async()=>{
    mailboxRepo.find.mockResolvedValue([]);

    const result=await controller.status();

    expect(result.success).toBe(true);
    expect(result.data.mailboxes).toEqual([]);
  });
});