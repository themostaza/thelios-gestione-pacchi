import GenericCardView from './GenericCardView'

export default function Dashboard() {
  return (
    <GenericCardView
      title='Gestione Utenti'
      description='Crea e gestisci gli utenti del sistema'
      useScrollArea={true}
    >
      <div>
        <h1>Dashboard</h1>
      </div>
    </GenericCardView>
  )
}
