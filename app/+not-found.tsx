import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;

  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={[styles.errorCode, { fontSize: width * 0.3 }]}>
            404
          </Text>
          <Text style={[styles.title, { fontSize: width * 0.07 }]}>
            Page Not Found
          </Text>
          <Text style={[styles.message, { fontSize: width * 0.04 }]}>
            The page you're looking for doesn't exist.
          </Text>

          <Link href="/" style={styles.button}>
            <View style={[
              styles.buttonContainer,
              {
                paddingVertical: height * 0.02,
                paddingHorizontal: width * 0.08,
              }
            ]}>
              <Text style={[styles.buttonText, { fontSize: width * 0.04 }]}>
                Go back to Home
              </Text>
            </View>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  errorCode: {
    fontWeight: 'bold',
    color: '#5B9EE1',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#0D1B2A',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#778899',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    width: '100%',
  },
  buttonContainer: {
    backgroundColor: '#5B9EE1',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B9EE1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
