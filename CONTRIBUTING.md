# Contributing to Event Management System

Thank you for your interest in contributing to our Event Management System! This document provides guidelines and instructions for contributing to both the frontend and backend components of the project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Frontend Development](#frontend-development)
- [Backend Development](#backend-development)
- [Creating a Pull Request](#creating-a-pull-request)
- [Code Review Process](#code-review-process)

## Getting Started

1. **Fork the Repository**
   - Click the "Fork" button on the top right of the repository page
   - This creates a copy of the repository in your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAM/eventmanagement.git
   cd eventmanagement
   ```
2.1 **Configure git who you are**
   ```bash
   # Skip if you have configured these configs
   git config --global user.email "you@example.com"
   git config --global user.name "Your Name"
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/MSHK-CodeToGive2025/eventmanagement.git
   ```

4. **Install Dependencies**
   - Frontend:
     ```bash
     cd frontend
     npm install
     ```
   - Backend:
     ```bash
     cd backend
     npm install
     ```

## Development Workflow

1. **Keep Your Fork Updated**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
   - Branch naming convention:
     - `feature/` for new features
     - `bugfix/` for bug fixes
     - `hotfix/` for urgent fixes
     - `refactor/` for code refactoring

3. **Make Your Changes**
   - Follow the code style guidelines
   - Write clear commit messages
   - Test your changes thoroughly

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   - Commit message format:
     ```
     type(scope): description
     
     [optional body]
     ```
   - Types: feat, fix, docs, style, refactor, test, chore
   - Example: `feat(auth): add user authentication`

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Style Guidelines

### Frontend
- Use TypeScript for all new components
- Follow React best practices
- Use functional components with hooks
- Follow the existing project structure
- Use ESLint and Prettier for code formatting

### Backend
- Follow RESTful API design principles
- Use proper error handling
- Write comprehensive tests
- Document API endpoints
- Follow the existing project structure

## Frontend Development

1. **Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Testing**
   ```bash
   npm run test
   ```

3. **Building**
   ```bash
   npm run build
   ```

## Backend Development

1. **Development Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Testing**
   ```bash
   npm run test
   ```

3. **Database Migrations**
   ```bash
   npm run migrate
   ```

## Creating a Pull Request

1. **Update Your Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push Your Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select the appropriate base branch (main or dev)
   - Write a clear description of your changes
   - Reference any related issues
   - Request review from team members

## Code Review Process

1. **Review Checklist**
   - Code follows style guidelines
   - Tests are included and passing
   - Documentation is updated
   - No breaking changes
   - Security considerations addressed

2. **Addressing Feedback**
   - Respond to all comments
   - Make necessary changes
   - Push updates to your branch
   - Mark comments as resolved when addressed

3. **After Approval**
   - Squash commits if requested
   - Wait for CI checks to pass
   - Merge will be handled by maintainers

## Additional Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Node.js Documentation](https://nodejs.org/en/docs/)

Thank you for contributing to our project! 