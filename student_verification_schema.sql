-- Add to your Prisma schema
model StudentVerification {
  id           Int      @id @default(autoincrement())
  buyerId      Int
  documentPath String
  status       String   @default("pending") // pending, approved, rejected
  reviewNotes  String?
  submittedAt  DateTime @default(now())
  reviewedAt   DateTime?
  reviewedBy   Int?
  
  buyer        Buyer    @relation(fields: [buyerId], references: [id])
  
  @@map("student_verifications")
}