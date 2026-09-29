
              {isLoading ? (
                <View style={styles.apptList}>
                  <Skeleton width="100%" height={44} borderRadius={14} />
                  <Skeleton width="100%" height={44} borderRadius={14} />
                </View>
>             ) : appointments.length > 0 ? (
                <View style={styles.apptList}>
                  {appointments.map(a => (
                    <View key={a.id} style={styles.apptListRow}>
                      <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                      <Text style={styles.apptListTime}>{a.time}</Text>
                      <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>{t('dashboardScreen.appointments.empty')}</Text>
              )}
  
              {/* Tüm Hesaplar — sosyal özet */}
              <CustomGlassCard style={styles.socialCard}>
                <View style={styles.socialHeader}>
                  <View style={styles.socialProfile}>
                    <View style={styles.socialAvatar}>
                      <MaterialIcons name="groups" size={18} color={COLORS.primaryFixedDim} />
                    </View>

