import styles from './RoomItem.module.css'

type RoomItemProps = {
  name: string
  selected: boolean
  onClick: () => void
}

export default function RoomItem({ name, selected, onClick: handleClick }: RoomItemProps) {

  return <button onClick={handleClick} className={selected ? styles.active : undefined}>{name}</button>
}