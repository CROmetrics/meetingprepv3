# Technical Implementation Guidelines

This document contains detailed technical patterns and code examples for building Node.js/React applications. For high-level principles, see CLAUDE.md.

## React Implementation Details

### Component Architecture Patterns

**Single Responsibility Components**
```tsx
// GOOD - Functional component with clear separation of concerns
const UserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const user = useUser(userId);
  const { updateProfile, isLoading } = useProfileActions();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <NotFound />;
  
  return <ProfileView user={user} onUpdate={updateProfile} />;
};
```

**Component Composition Pattern**
```tsx
// GOOD - Composable components
<Card>
  <CardHeader title="User Settings" />
  <CardBody>
    <SettingsForm />
  </CardBody>
  <CardFooter>
    <SaveButton />
  </CardFooter>
</Card>

// AVOID - Configuration-heavy component
<Card 
  title="User Settings"
  showHeader={true}
  showFooter={true}
  footerButtons={['save', 'cancel']}
  bodyContent={<SettingsForm />}
/>
```

### Custom Hooks Implementation

```tsx
// Custom hook for API data fetching
const useApiData = <T,>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<T>(endpoint);
        setData(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};
```

### Complex State Management with useReducer

```tsx
// Complex state with useReducer
const profileReducer = (state: ProfileState, action: ProfileAction) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false };
    case 'UPDATE_FIELD':
      return { ...state, user: { ...state.user, [action.field]: action.value } };
    default:
      return state;
  }
};
```

## Node.js/Express Implementation

### Middleware Composition Pattern

```typescript
// Composable middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Authentication logic
  next();
};

const authorize = (role: string) => (req: Request, res: Response, next: NextFunction) => {
  // Authorization logic
  next();
};

const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  // Validation logic
  next();
};

// Composed route
router.post('/admin/users',
  authenticate,
  authorize('admin'),
  validate(createUserSchema),
  createUser
);
```

### Service Layer Pattern

```typescript
// controllers/userController.ts - Thin controller
export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// services/userService.ts - Business logic
export const findById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  
  // Business logic transformations
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    isActive: user.status === 'active'
  };
};
```

### Custom Error Classes

```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, message);
  }
}
```

## Type Safety Patterns

### Comprehensive Type Definitions

```typescript
// types/user.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UserResponse {
  success: boolean;
  data?: User;
  error?: string;
}
```

## Utility Functions Library

```typescript
// utils/common.ts
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
```

## Constants and Configuration

```typescript
// config/constants.ts
export const API_ENDPOINTS = {
  USERS: '/api/users',
  POSTS: '/api/posts',
  AUTH: '/api/auth',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MAX_LENGTH: 30,
} as const;
```

## Performance Optimization Techniques

### React Performance

**Memoization Patterns**
```tsx
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks passed to child components
const handleClick = useCallback((id: string) => {
  // handle click
}, [dependency]);

// Memoize components
const MemoizedComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
}, (prevProps, nextProps) => {
  // Return true if props are equal
  return prevProps.data === nextProps.data;
});
```

**Code Splitting**
```tsx
// Dynamic imports for large components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Node.js Performance

**Database Query Optimization**
```typescript
// Use select to fetch only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  },
  where: {
    isActive: true,
  },
  take: 20, // Pagination
  skip: page * 20,
});

// Batch operations
const results = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData }),
  prisma.settings.create({ data: settingsData }),
]);
```

**Caching Implementation**
```typescript
// Simple in-memory cache with TTL
class Cache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  async getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached) return cached;
    
    const data = await fetcher();
    this.set(key, data);
    return data;
  }
}

// Usage
const userCache = new Cache<User>(300); // 5 minute TTL
const user = await userCache.getOrFetch(userId, () => fetchUserFromDB(userId));
```

## Testing Patterns

### Unit Test Example
```typescript
// userService.test.ts
describe('UserService', () => {
  describe('findById', () => {
    it('should return user with calculated fields', async () => {
      const mockUser = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        status: 'active',
      };
      
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      
      const result = await userService.findById('1');
      
      expect(result.fullName).toBe('John Doe');
      expect(result.isActive).toBe(true);
    });
  });
});
```

### React Component Test
```tsx
// UserProfile.test.tsx
describe('UserProfile', () => {
  it('should display loading state', () => {
    const { getByTestId } = render(<UserProfile userId="1" />);
    expect(getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('should display user data when loaded', async () => {
    const { getByText } = render(<UserProfile userId="1" />);
    await waitFor(() => {
      expect(getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

## Security Implementation

### Input Validation with Zod
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase'),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  age: z.number().min(18).max(120).optional(),
});

// In route handler
export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        errors: error.errors 
      });
    }
  }
};
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

app.use('/api/auth/', authLimiter);
```

## Database Patterns with Prisma

### Model Definition
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  profile   Profile?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
  @@map("users")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

### Migration and Seeding
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  // Clean existing data
  await prisma.user.deleteMany();
  
  // Create seed data
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@crometrics.com',
        firstName: 'Admin',
        lastName: 'User',
        password: await hash('securepassword'),
        role: 'ADMIN',
      },
      // More seed data...
    ],
  });
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Advanced Patterns

### Repository Pattern
```typescript
// repositories/UserRepository.ts
export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
  
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }
  
  async create(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({ data });
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
  
  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
```

### Event Emitter Pattern
```typescript
// events/EventBus.ts
import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  emit(event: string, ...args: any[]): boolean {
    console.log(`Event emitted: ${event}`);
    return super.emit(event, ...args);
  }
}

export const eventBus = new EventBus();

// Usage in services
eventBus.emit('user:created', { userId, email });
eventBus.on('user:created', async ({ userId, email }) => {
  // Send welcome email
  // Create default settings
  // Log analytics event
});
```

## Code Quality Tools Configuration

### ESLint Rules
```json
{
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### TypeScript Strict Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```