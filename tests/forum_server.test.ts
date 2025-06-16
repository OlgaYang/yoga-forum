import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../src/index'

describe('Query: posts', () => {
    it('returns posts in default order (DESC)', async () => {
        const query = `
query GetPosts {
  posts {
    id
    content
  }
}
    `
        const response = await request(app)
            .post('/graphql')
            .send({ query })

        expect(response.statusCode).toBe(200)
        expect(response.body.data.posts[0].id).toBe('3')
    }),
        it('returns posts in DESC order', async () => {
            const query = `
query GetPosts {
  posts(order: DESC) {
    id
    content
  }
}
    `
            const response = await request(app)
                .post('/graphql')
                .send({ query })

            expect(response.statusCode).toBe(200)
            expect(response.body.data.posts[0].id).toBe('3')
        }),
        it('returns posts in ASC order', async () => {
            const query = `
query GetPosts {
  posts(order: ASC) {
    id
    content
  }
}
    `
            const response = await request(app)
                .post('/graphql')
                .send({ query })

            expect(response.statusCode).toBe(200)
            expect(response.body.data.posts[0].id).toBe('1')
        }),
        it('returns posts in first 2', async () => {
            const query = `
query GetPosts {
  posts(first: 2) {
    id
    content
  }
}
    `
            const response = await request(app)
                .post('/graphql')
                .send({ query })

            expect(response.statusCode).toBe(200)
            expect(response.body.data.posts).toHaveLength(2)
        })
})