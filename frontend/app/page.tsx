'use client'
import HomeComponent from "@/components/homeComponent";
import styles from "./page.module.css";
import "./globals.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <HomeComponent></HomeComponent>
    </main>
  );
}
