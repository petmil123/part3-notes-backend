const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Note = require('../models/note')
const helper = require('./test_helper')

beforeEach(async () => {
    await Note.deleteMany({})
  
    const noteObjects = helper.initialNotes
      .map(note => new Note(note))
    const promiseArray = noteObjects.map(note => note.save())
    await Promise.all(promiseArray)
  })

describe('Fetching notes:', () => {


    test('notes are returned as json', async () => {
        await api
            .get('/api/notes')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all notes are returned', async () => {
        const response = await api.get('/api/notes')

        expect(response.body).toHaveLength(helper.initialNotes.length)
    })

    test('A specific note is within the returned note', async () => {
        const response = await api.get('/api/notes')

        const contents = response.body.map(r => r.content)
        expect(contents).toContain(
            'Browser can execute only Javascript'
        )
    })

})

describe('Adding a note:', () => {


    test('A valid note can be added', async () => {
        const newNote = {
            content: 'async/await simplifies making async calls',
            important: true
        }
        await api
            .post('/api/notes')
            .send(newNote)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const notesAtEnd = await helper.notesInDb()
        expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)

        const contents = notesAtEnd.map(r => r.content)
        expect(contents).toContain(
            'async/await simplifies making async calls'
        )
    })

    test('Note without content is not added', async () => {
        const newNote = {
            important: true
        }

        await api
            .post('/api/notes')
            .send(newNote)
            .expect(400)

        const notesAtEnd = await helper.notesInDb()

        expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
    })

})

describe('Specific notes', () => {
    test('A specific note can be viewed', async () => {
        const notesAtStart = await helper.notesInDb()
        const noteToView = notesAtStart[0]

        const resultNote = await api
        .get(`/api/notes/${noteToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

        const processedNoteToView = JSON.parse(JSON.stringify(noteToView))

        expect(resultNote.body).toEqual(processedNoteToView)
    })

    test('A note can be deleted', async () => {
        const notesAtStart = await helper.notesInDb()
        const noteToDelete = notesAtStart[0]

        await api
        .delete(`/api/notes/${noteToDelete.id}`)
        .expect(204)

        const notesAtEnd = await helper.notesInDb()

        expect(notesAtEnd).toHaveLength(
            helper.initialNotes.length - 1
        )

        const contents = notesAtEnd.map(r => r.content)

        expect(contents).not.toContain(noteToDelete.content)
    })
})
afterAll(() => {
    mongoose.connection.close()
})
