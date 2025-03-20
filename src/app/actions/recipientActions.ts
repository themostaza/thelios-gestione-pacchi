'use server'

// Mock database of users
const recipients = [
  {
    name: 'Francesco',
    surname: 'Blu',
    email: 'francesco.blu@thelios.com',
  },
  {
    name: 'Marco',
    surname: 'Rossi',
    email: 'marco.rossi@thelios.com',
  },
  {
    name: 'Laura',
    surname: 'Bianchi',
    email: 'laura.bianchi@thelios.com',
  },
  {
    name: 'Giulia',
    surname: 'Verdi',
    email: 'giulia.verdi@thelios.com',
  },
  {
    name: 'Fabio',
    surname: 'Gialli',
    email: 'fabio.gialli@thelios.com',
  },
  {
    name: 'Antonio',
    surname: 'Ferrari',
    email: 'antonio.ferrari@thelios.com',
  },
]

export async function searchRecipients(query: string) {
  // Simulate a delay (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Filter recipients based on the query
  const normalizedQuery = query.toLowerCase()
  const filteredRecipients = !normalizedQuery
    ? []
    : recipients.filter(
        (recipient) => recipient.name.toLowerCase().includes(normalizedQuery) || recipient.surname.toLowerCase().includes(normalizedQuery) || recipient.email.toLowerCase().includes(normalizedQuery)
      )

  return filteredRecipients
}
