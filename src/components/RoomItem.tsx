import styles from './RoomItem.module.css'

type RoomItemProps = {
  name: string
  selected: boolean
  onClick: () => void
}

export default function RoomItem({ name, selected, onClick: handleClick }: RoomItemProps) {

  return (
    <button
      onClick={handleClick}
      className={selected ? `${styles.button} ${styles.active}`: styles.button}
    >
      <span className={styles.icon}>#</span>
      <span className={styles.name}>{name}</span>
    </button>
  )
}