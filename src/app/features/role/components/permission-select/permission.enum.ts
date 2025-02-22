export enum RoutePermission {
  // Permissões de Admin
  ADMIN = 'ADMIN',

  // Permissões de Alunos
  VIEW_STUDENTS = 'VIEW_STUDENTS',
  CREATE_STUDENT = 'CREATE_STUDENT',
  EDIT_STUDENT = 'EDIT_STUDENT',
  DELETE_STUDENT = 'DELETE_STUDENT',
  VIEW_STUDENT_LOGIN = 'VIEW_STUDENT_LOGIN',
  VIEW_STUDENT_FINANCIAL = 'VIEW_STUDENT_FINANCIAL',

  // Permissões de Cursos
  VIEW_COURSES = 'VIEW_COURSES',
  CREATE_COURSE = 'CREATE_COURSE',
  EDIT_COURSE = 'EDIT_COURSE',
  DELETE_COURSE = 'DELETE_COURSE',

  // Permissões de Pacotes
  VIEW_PACKAGES = 'VIEW_PACKAGES',
  CREATE_PACKAGE = 'CREATE_PACKAGE',
  EDIT_PACKAGE = 'EDIT_PACKAGE',
  DELETE_PACKAGE = 'DELETE_PACKAGE',

  // Permissões de Categorias
  VIEW_CATEGORIES = 'VIEW_CATEGORIES',
  CREATE_CATEGORY = 'CREATE_CATEGORY',
  EDIT_CATEGORY = 'EDIT_CATEGORY',
  DELETE_CATEGORY = 'DELETE_CATEGORY',

  // Permissões de Turmas
  VIEW_CLASSES = 'VIEW_CLASSES',
  CREATE_CLASS = 'CREATE_CLASS',
  EDIT_CLASS = 'EDIT_CLASS',
  DELETE_CLASS = 'DELETE_CLASS',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  EDIT_ATTENDANCE = 'EDIT_ATTENDANCE',

  // Permissões de Funcionários
  VIEW_EMPLOYEES = 'VIEW_EMPLOYEES',
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  EDIT_EMPLOYEE = 'EDIT_EMPLOYEE',
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE',

  // Permissões de Funções
  VIEW_ROLES = 'VIEW_ROLES',
  CREATE_ROLE = 'CREATE_ROLE',
  EDIT_ROLE = 'EDIT_ROLE',
  DELETE_ROLE = 'DELETE_ROLE',

  // Permissões de Vagas
  VIEW_JOBS = 'VIEW_JOBS',
  CREATE_JOB = 'CREATE_JOB',
  EDIT_JOB = 'EDIT_JOB',
  DELETE_JOB = 'DELETE_JOB',

  // Permissões de Exames
  VIEW_EXAMS = 'VIEW_EXAMS',
  CREATE_EXAM = 'CREATE_EXAM',
  EDIT_EXAM = 'EDIT_EXAM',
  DELETE_EXAM = 'DELETE_EXAM',

  // Permissões de Biblioteca
  VIEW_LIBRARY = 'VIEW_LIBRARY',
  MANAGE_LIBRARY = 'MANAGE_LIBRARY',

  // Permissões de Aulas ao Vivo
  VIEW_MEETINGS = 'VIEW_MEETINGS',
  CREATE_MEETING = 'CREATE_MEETING',
  MANAGE_MEETING = 'MANAGE_MEETING'
}
