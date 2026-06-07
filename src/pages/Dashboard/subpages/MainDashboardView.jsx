import { useState, useEffect, useCallback } from 'react';
import { apiJson, toArray } from '../../../api/client';
import { getUserId } from '../../../utils/user';
import StatCard from '../components/StatCard';
import WidgetList from '../components/WidgetList';
import InitiativeWidget from '../components/InitiativeWidget';

function MainDashboardView({ user }) {
  const userId = getUserId(user);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastLogoutAt, setLastLogoutAt] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsAll, setReportsAll] = useState([]);
  const [payments, setPayments] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [messageThreads, setMessageThreads] = useState([]);
  const [totalUsers, setTotalUsers] = useState(1);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [stats, setStats] = useState({
    paymentsAmount: 0,
    activeReports: 0,
    unreadMessages: 0,
    activeInitiatives: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [
        announcementsResponse,
        reportsResponse,
        paymentsResponse,
        messagesResponse,
        initiativesResponse,
        usersResponse,
      ] = await Promise.all([
        apiJson('/api/announcements'),
        apiJson('/api/reports', { query: userId ? { reporterId: userId } : {} }),
        apiJson('/api/payments', { query: userId ? { payerId: userId } : {} }),
        apiJson('/api/messaging/threads'),
        apiJson('/api/initiatives'),
        apiJson('/api/user'),
      ]);

      const announcementsData = toArray(announcementsResponse, ['announcements']);
      const reportsData = toArray(reportsResponse, ['reports']);
      const paymentsData = toArray(paymentsResponse, ['paymentRequests', 'payments']);
      const messagesData = toArray(messagesResponse, ['threads']);
      const initiativesData = toArray(initiativesResponse, ['initiatives']);
      const usersData = toArray(usersResponse, ['users']);

      setTotalUsers(usersData.length > 0 ? usersData.length : 1);

      setAnnouncements(
        [...announcementsData]
          .sort(
            (a, b) =>
              new Date(b.createdDate || b.createdAt) -
              new Date(a.createdDate || a.createdAt)
          )
          .slice(0, 3)
      );

      setReportsAll(reportsData);
      setReports(
        [...reportsData]
          .sort(
            (a, b) =>
              new Date(b.createdDate || b.createdAt) -
              new Date(a.createdDate || a.createdAt)
          )
          .slice(0, 3)
      );

      setPayments(paymentsData);
      setInitiatives(initiativesData);
      setMessageThreads(messagesData);

      // SUMA NIEOPŁACONYCH NALEŻNOŚCI
      const paymentsAmount = paymentsData
        .filter(
          payment =>
            payment.status !== 'PAID' &&
            payment.status !== 'Paid' &&
            payment.status !== 'ACCEPTED'
        )
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0),
          0
        );

      // AKTYWNE ZGŁOSZENIA
      const activeReports = reportsData.filter(
        report =>
          report.status !== 'COMPLETED' &&
          report.status !== 'Zakończone' &&
          report.status !== 'CLOSED'
      ).length;

      // NIEPRZECZYTANE WIADOMOŚCI
      const unreadMessages = messagesData.reduce(
        (sum, thread) =>
          sum + Number(thread.unreadCount || 0),
        0
      );

      // AKTYWNE GŁOSOWANIA
      const activeInitiatives = initiativesData.filter((initiative) => {
        const isPastDeadline = !initiative.deadline || new Date(initiative.deadline) < new Date();
        const upvotes = Number(initiative.upvotes || initiative.upVotes || 0);
        const downvotes = Number(initiative.downvotes || initiative.downVotes || 0);
        const isFullyVoted = usersData.length > 0 && (upvotes + downvotes) >= usersData.length;
        return !isPastDeadline && !isFullyVoted;
      }).length;

      setStats({
        paymentsAmount,
        activeReports,
        unreadMessages,
        activeInitiatives,
      });
    } catch (err) {
      console.error('Błąd pobierania danych:', err);

      setAnnouncements([]);
      setReports([]);
      setPayments([]);
      setInitiatives([]);
      setMessageThreads([]);

      setStats({
        paymentsAmount: 0,
        activeReports: 0,
        unreadMessages: 0,
        activeInitiatives: 0,
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [userId]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiJson('/api/user/me');
        const userData = data?.user || data;
        setCurrentUser(userData);
        if (userData?.lastLogoutAt) {
          setLastLogoutAt(new Date(userData.lastLogoutAt));
        }
      } catch (error) {
        console.error('Błąd pobierania danych aktualnego użytkownika:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!announcementId) {
      alert('Nie można usunąć ogłoszenia bez identyfikatora.');
      return;
    }

    const confirmed = window.confirm('Czy na pewno chcesz usunąć to ogłoszenie?');
    if (!confirmed) return;

    try {
      await apiJson(`/api/announcements/delete/${announcementId}`, {
        method: 'DELETE',
      });
      await fetchData();
    } catch (error) {
      console.error('Błąd usuwania ogłoszenia:', error);
      alert('Nie udało się usunąć ogłoszenia.');
    }
  };

  useEffect(() => {
    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const data = await apiJson('/api/messaging/unread');
        if (active) setUnreadMessagesCount(Number(data?.amount || 0));
      } catch (error) {
        console.error('Błąd pobierania liczby nieprzeczytanych wiadomości:', error);
        if (active) setUnreadMessagesCount(0);
      }
    };

    if (!userId) {
      return undefined;
    }

    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 10000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [userId]);

  const getThreadLastMessageDate = (thread) => {
    const timestamp =
      thread?.lastMessageDate ||
      thread?.updatedAt ||
      thread?.createdAt ||
      thread?.lastMessage?.createdAt ||
      thread?.lastMessage?.sentAt ||
      thread?.lastMessage?.timestamp ||
      thread?.lastMessage?.time ||
      thread?.sentAt ||
      null;

    const date = timestamp ? new Date(timestamp) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  };

  const computeStats = (
    paymentsData,
    reportsData,
    initiativesData,
    messagesData,
    logoutDate,
    totalUsersCount
  ) => {
    const paymentsAmount = paymentsData
      .filter(
        (payment) =>
          payment.status !== 'PAID' &&
          payment.status !== 'Paid' &&
          payment.status !== 'ACCEPTED'
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const activeReports = reportsData.filter(
      (report) =>
        report.status !== 'COMPLETED' &&
        report.status !== 'Zakończone' &&
        report.status !== 'CLOSED'
    ).length;

    const unreadMessages = logoutDate
      ? Number(unreadMessagesCount || 0)
      : messagesData.reduce((sum, thread) => sum + Number(thread.unreadCount || thread.unread || 0), 0);

    const activeInitiatives = initiativesData.filter((initiative) => {
      const isPastDeadline = !initiative.deadline || new Date(initiative.deadline) < new Date();
      const upvotes = Number(initiative.upvotes || initiative.upVotes || 0);
      const downvotes = Number(initiative.downvotes || initiative.downVotes || 0);
      const isFullyVoted = totalUsersCount > 0 && (upvotes + downvotes) >= totalUsersCount;
      return !isPastDeadline && !isFullyVoted;
    }).length;

    return {
      paymentsAmount,
      activeReports,
      unreadMessages,
      activeInitiatives,
    };
  };

  useEffect(() => {
    setStats(
      computeStats(
        payments,
        reportsAll,
        initiatives,
        messageThreads,
        lastLogoutAt,
        totalUsers
      )
    );
  }, [payments, reportsAll, initiatives, messageThreads, lastLogoutAt, unreadMessagesCount, totalUsers]);

  const getInitiativePercentage = (initiative) => {
    const rawPercentage =
      initiative.votePercentage ??
      initiative.percentage;

    if (rawPercentage != null && rawPercentage !== '') {
      return Number(rawPercentage);
    }

    const totalVotes = (initiative.upvotes || 0) + (initiative.downvotes || 0);
    return totalUsers > 0
      ? Math.round((totalVotes / totalUsers) * 100)
      : 0;
  };

  const latestInitiatives =
    initiatives.length > 0
      ? [...initiatives]
          .filter((initiative) => {
            const isPastDeadline = !initiative.deadline || new Date(initiative.deadline) < new Date();
            const upvotes = Number(initiative.upvotes || initiative.upVotes || 0);
            const downvotes = Number(initiative.downvotes || initiative.downVotes || 0);
            const isFullyVoted = totalUsers > 0 && (upvotes + downvotes) >= totalUsers;
            return !isPastDeadline && !isFullyVoted;
          })
          .sort(
            (a, b) =>
              new Date(b.createdDate || b.createdAt) -
              new Date(a.createdDate || a.createdAt)
          )
          .slice(0, 2)
      : [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* KAFELKI STATYSTYK */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}
      >
        <StatCard
          title="Należności"
          value={`${stats.paymentsAmount.toFixed(2)} zł`}
          subtext="Do zapłaty"
          type="payment"
        />

        <StatCard
          title="Zgłoszenia"
          value={stats.activeReports}
          subtext="Aktywne"
          type="reports"
        />

        <StatCard
          title="Wiadomości"
          value={stats.unreadMessages}
          subtext="Nieprzeczytane"
          type="messages"
        />

        <StatCard
          title="Inicjatywy"
          value={stats.activeInitiatives}
          subtext="Do zagłosowania"
          type="initiatives"
        />
      </div>

      {/* OGŁOSZENIA I ZGŁOSZENIA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: '15px',
            }}
          >
            <h3 style={{ fontWeight: 'bold' }}>
              Ostatnie ogłoszenia
            </h3>
          </div>

          <WidgetList
            items={announcements}
            type="announcements"
            currentUser={currentUser}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: '15px',
            }}
          >
            <h3 style={{ fontWeight: 'bold' }}>
              Moje zgłoszenia
            </h3>
          </div>

          <WidgetList
            items={reports}
            type="reports"
          />
        </div>
      </div>

      {/* INICJATYWY */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            marginBottom: '15px',
          }}
        >
          <h3 style={{ fontWeight: 'bold' }}>
            Inicjatywy do głosowania
          </h3>
        </div>

        {latestInitiatives.length > 0 ? (
          latestInitiatives.map((initiative) => (
            <InitiativeWidget
              key={initiative.id || initiative._id || initiative.title}
              title={initiative.title}
              description={initiative.description}
              percentage={getInitiativePercentage(initiative)}
            />
          ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: '#6b7280',
              padding: '20px',
            }}
          >
            Brak aktywnych inicjatyw
          </div>
        )}
      </div>
    </div>
  );
}

export default MainDashboardView;
