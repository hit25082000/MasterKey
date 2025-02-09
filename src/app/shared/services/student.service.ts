  getStudentEmail(userId: string): string | null {
    const student = this.selectStudent(userId)();
    return student?.email || null;
  } 